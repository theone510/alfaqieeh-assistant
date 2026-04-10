/**
 * ingest-v3-only.cjs
 * 
 * يرفع فقط إدخالات الجزء الثالث الجديدة إلى Supabase
 * (الإدخالات التي تبدأ بـ intro_v3_ أو minhaj_v3_head_ أو minhaj_v3_masalah_)
 * 
 * الاستخدام:
 *   node scripts/ingest-v3-only.cjs
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 5;
const DELAY_MS = 200;
const MAX_TEXT_LENGTH = 8000;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error('❌ Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

const CORPUS_PATH = path.resolve(__dirname, '../final_fiqh_corpus.json');
const PROGRESS_PATH = path.resolve(__dirname, 'v3-ingest-progress.json');

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

async function generateEmbedding(text) {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await embeddingModel.embedContent({
                content: { parts: [{ text }] },
                taskType: "RETRIEVAL_DOCUMENT",
            });
            return result.embedding.values.slice(0, 768);
        } catch (error) {
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000;
                console.warn(`\n   ⚠️ Retry ${attempt}/${maxRetries} (${waitTime}ms): ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error(`\n   ❌ Failed after ${maxRetries} attempts: ${error.message}`);
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

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  📤 Upload Part 3 Only to Supabase           ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    console.log('📂 Loading corpus...');
    const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
    console.log(`   Total corpus: ${corpus.length} items`);

    // Filter only new v3 entries
    const v3Entries = corpus.filter(item => {
        const id = item.id || '';
        return id.startsWith('intro_v3_') ||
            id.startsWith('minhaj_v3_head_') ||
            id.startsWith('minhaj_v3_masalah_');
    });

    // Exclude the OLD minhaj_v3 entries that were renamed to minhaj_v2 by fix-volume.cjs
    // The new entries from process-v3.cjs have patterns like minhaj_v3_masalah_1 through minhaj_v3_masalah_1083+
    // while the old swapped ones were minhaj_v3_masalah_421 through ~1100 range but are now minhaj_v2
    console.log(`   ✅ Found ${v3Entries.length} Part 3 entries to upload\n`);

    if (v3Entries.length === 0) {
        console.log('   ⚠️ No Part 3 entries found!');
        return;
    }

    // Show sample
    console.log('   📋 Samples:');
    console.log(`      First: ${v3Entries[0].id} — ${v3Entries[0].hierarchy}`);
    console.log(`      Last:  ${v3Entries[v3Entries.length - 1].id} — ${v3Entries[v3Entries.length - 1].hierarchy}\n`);

    const progress = loadProgress();
    const startIndex = progress.lastProcessedIndex + 1;

    if (startIndex > 0) {
        console.log(`🔁 Resuming from item ${startIndex} (${progress.successCount} done)\n`);
    }

    const startTime = Date.now();

    for (let i = startIndex; i < v3Entries.length; i += BATCH_SIZE) {
        const batch = v3Entries.slice(i, Math.min(i + BATCH_SIZE, v3Entries.length));

        await Promise.all(batch.map(async (item) => {
            const text = cleanText(item.text || item.original_text || '');
            if (!text || text.length < 10) {
                progress.skippedCount++;
                return;
            }

            const processedText = text.substring(0, MAX_TEXT_LENGTH);

            const metadata = {
                id: item.id || '',
                book: item.book || '',
                hierarchy: item.hierarchy || '',
                masalah_number: item.masalah_number || '',
                full_citation: item.full_citation || '',
                url: item.url || '',
                title: item.title || '',
            };

            const embedding = await generateEmbedding(processedText);
            if (!embedding) {
                progress.errorCount++;
                return;
            }

            const { error } = await supabase.from('fatwas').insert({
                content: processedText,
                metadata: metadata,
                embedding: embedding,
            });

            if (error) {
                console.error(`\n   ❌ Insert error: ${item.id} — ${error.message}`);
                progress.errorCount++;
            } else {
                progress.successCount++;
            }
        }));

        progress.lastProcessedIndex = Math.min(i + BATCH_SIZE - 1, v3Entries.length - 1);
        saveProgress(progress);

        const done = Math.min(i + BATCH_SIZE, v3Entries.length);
        const percent = ((done / v3Entries.length) * 100).toFixed(1);
        const elapsed = Date.now() - startTime;
        const rate = done - startIndex > 0 ? elapsed / (done - startIndex) : 0;
        const remaining = rate * (v3Entries.length - done);

        process.stdout.write(
            `\r   📊 ${done}/${v3Entries.length} (${percent}%) | ✅ ${progress.successCount} | ❌ ${progress.errorCount} | ⏱️ ${formatTime(elapsed)} | ETA: ${formatTime(remaining)}   `
        );

        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🎉 Part 3 Upload Complete!                  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   ✅ Success: ${progress.successCount}`);
    console.log(`   ❌ Errors:  ${progress.errorCount}`);
    console.log(`   ⏭️  Skipped: ${progress.skippedCount}`);
    console.log(`   ⏱️  Total:   ${formatTime(Date.now() - startTime)}`);

    if (progress.errorCount === 0 && fs.existsSync(PROGRESS_PATH)) {
        fs.unlinkSync(PROGRESS_PATH);
        console.log('\n   🧹 Progress file cleaned up.');
    } else if (progress.errorCount > 0) {
        console.log(`\n   ⚠️ Run again to retry errors.`);
    }
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
