/**
 * reingest-corpus.cjs
 * 
 * يقرأ final_fiqh_corpus.json ويرفع البيانات إلى Supabase مع metadata كاملة.
 * يحفظ التقدم في progress.json للاستئناف عند التوقف.
 * 
 * الاستخدام:
 *   node scripts/reingest-corpus.cjs
 * 
 * قبل التشغيل:
 *   1. نفّذ TRUNCATE TABLE fatwas; في Supabase Dashboard
 *   2. تأكد من وجود .env.local يحتوي VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY
 */

const fs = require('fs');
const path = require('path');
// Try .env.local first, then .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 5;          // عدد المسائل المعالجة بالتوازي
const DELAY_MS = 200;          // تأخير بين الدفعات (ملي ثانية)
const MAX_TEXT_LENGTH = 8000;  // الحد الأقصى لطول النص

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error('❌ Missing environment variables. Check .env.local for:');
    console.error('   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY');
    process.exit(1);
}

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

// Paths
const CORPUS_PATH = path.resolve(__dirname, '../final_fiqh_corpus.json');
const PROGRESS_PATH = path.resolve(__dirname, 'reingest-progress.json');

// --- Helper Functions ---

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

async function generateEmbedding(text) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await embeddingModel.embedContent({
                content: { parts: [{ text }] },
                taskType: "RETRIEVAL_DOCUMENT",
            });
            // Slice to 768 dimensions (Matryoshka-compliant)
            return result.embedding.values.slice(0, 768);
        } catch (error) {
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000; // Exponential backoff
                console.warn(`   ⚠️ Embedding retry ${attempt}/${maxRetries} (waiting ${waitTime}ms): ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error(`   ❌ Embedding failed after ${maxRetries} attempts: ${error.message}`);
                return null;
            }
        }
    }
}

function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_PATH)) {
            return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
        }
    } catch (e) { }
    return { lastProcessedIndex: -1, successCount: 0, errorCount: 0, skippedCount: 0 };
}

function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// --- Main ---

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🔄 Supabase Re-ingestion from Corpus      ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Load corpus
    if (!fs.existsSync(CORPUS_PATH)) {
        console.error(`❌ Corpus file not found: ${CORPUS_PATH}`);
        process.exit(1);
    }

    console.log('📂 Loading corpus...');
    const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
    console.log(`   ✅ Loaded ${corpus.length} items\n`);

    // Load progress
    const progress = loadProgress();
    const startIndex = progress.lastProcessedIndex + 1;

    if (startIndex > 0) {
        console.log(`🔁 Resuming from item ${startIndex} (${progress.successCount} already done, ${progress.errorCount} errors)\n`);
    }

    const startTime = Date.now();

    // Process in batches
    for (let i = startIndex; i < corpus.length; i += BATCH_SIZE) {
        const batch = corpus.slice(i, Math.min(i + BATCH_SIZE, corpus.length));

        await Promise.all(batch.map(async (item, batchIdx) => {
            const globalIdx = i + batchIdx;

            // Prepare text for embedding
            const text = cleanText(item.text || item.original_text || '');
            if (!text || text.length < 10) {
                progress.skippedCount++;
                return;
            }

            const processedText = text.substring(0, MAX_TEXT_LENGTH);

            // Build rich metadata
            const metadata = {
                id: item.id || '',
                book: item.book || '',
                hierarchy: item.hierarchy || '',
                masalah_number: item.masalah_number || '',
                full_citation: item.full_citation || '',
                url: item.url || '',
                title: item.title || '',
            };

            // Generate embedding
            const embedding = await generateEmbedding(processedText);
            if (!embedding) {
                progress.errorCount++;
                return;
            }

            // Insert into Supabase
            const { error } = await supabase.from('fatwas').insert({
                content: processedText,
                metadata: metadata,
                embedding: embedding,
            });

            if (error) {
                console.error(`   ❌ Insert error at item ${globalIdx}: ${error.message}`);
                progress.errorCount++;
            } else {
                progress.successCount++;
            }
        }));

        // Update progress
        progress.lastProcessedIndex = Math.min(i + BATCH_SIZE - 1, corpus.length - 1);
        saveProgress(progress);

        // Show progress
        const done = Math.min(i + BATCH_SIZE, corpus.length);
        const percent = ((done / corpus.length) * 100).toFixed(1);
        const elapsed = Date.now() - startTime;
        const rate = done - startIndex > 0 ? elapsed / (done - startIndex) : 0;
        const remaining = rate * (corpus.length - done);

        process.stdout.write(
            `\r   📊 ${done}/${corpus.length} (${percent}%) | ✅ ${progress.successCount} | ❌ ${progress.errorCount} | ⏱️ ${formatTime(elapsed)} | ETA: ${formatTime(remaining)}   `
        );

        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🎉 Re-ingestion Complete!                  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   ✅ Success: ${progress.successCount}`);
    console.log(`   ❌ Errors:  ${progress.errorCount}`);
    console.log(`   ⏭️  Skipped: ${progress.skippedCount}`);
    console.log(`   ⏱️  Total:   ${formatTime(Date.now() - startTime)}`);

    // Clean up progress file on success
    if (progress.errorCount === 0 && fs.existsSync(PROGRESS_PATH)) {
        fs.unlinkSync(PROGRESS_PATH);
        console.log('\n   🧹 Progress file cleaned up.');
    } else if (progress.errorCount > 0) {
        console.log(`\n   ⚠️ Progress saved to ${PROGRESS_PATH}. Run again to retry errors.`);
    }
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
