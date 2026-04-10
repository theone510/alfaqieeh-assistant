/**
 * fix-volume.cjs
 * 
 * يصلح خطأ رقم الجزء في منهاج الصالحين:
 * 
 * التغييرات:
 * 1. كل minhaj_v3 (الجزء الثالث) → الجزء الثاني (كتب المعاملات)
 * 2. بعض minhaj_v2 (الجزء الثاني) → الجزء الثالث (كتب الأحوال الشخصية: النكاح، الطلاق، الميراث، إلخ)
 * 
 * الاستخدام:
 *   node scripts/fix-volume.cjs
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const CORPUS_PATH = path.resolve(__dirname, '../final_fiqh_corpus.json');
const BATCH_SIZE = 20;

// الكتب التي يجب أن تكون الجزء الثالث (حالياً بعضها مسجل كجزء ثاني خطأً)
const PART3_BOOKS = [
    'كتاب النكاح',
    'كتاب الطلاق',
    'كتاب الطـلاق',
    'كتاب الخلع والمباراة',
    'كتاب الظهار',
    'كتـاب الظهار',
    'كتاب الإيلاء',
    'كتاب الإيـلاء',
    'كتاب اللعان',
    'كتاب الأيمان والنذور والعهود',
    'كتاب الكفارات',
    'كتاب الكفّارات',
    'كتاب الصيد والذباحة',
    'كتاب الصيد والذباحـة',
    'كتاب الأطعمة والأشربة',
    'كتاب الأطعمـة والأشـربة',
    'كتاب الميراث',
    'كتاب المـيراث',
    'كتاب المواريث',
];

function shouldBePart3(hierarchy) {
    if (!hierarchy) return false;
    for (const book of PART3_BOOKS) {
        if (hierarchy.startsWith(book) || hierarchy === book) return true;
    }
    // Also check for الامر الخامس ـ اللعان (standalone entry)
    if (hierarchy.includes('اللعان') && !hierarchy.includes('النكاح')) return true;
    return false;
}

function replaceAll(str, from, to) {
    if (!str) return str;
    return str.split(from).join(to);
}

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🔧 Fix Volumes: منهاج الصالحين              ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    console.log('📂 Loading corpus...');
    const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
    console.log(`   ✅ Loaded ${corpus.length} items\n`);

    let v3_to_v2 = 0;  // minhaj_v3 → minhaj_v2
    let v2_to_v3 = 0;  // minhaj_v2 (أحوال شخصية) → minhaj_v3
    const fixedEntries = [];

    for (let i = 0; i < corpus.length; i++) {
        const item = corpus[i];
        if (!item.id) continue;

        // Case 1: minhaj_v3 → should become v2 (المعاملات books)
        if (item.id.startsWith('minhaj_v3')) {
            const oldContent = (item.text || '').replace(/\s+/g, ' ').trim().substring(0, 8000);

            item.id = item.id.replace('minhaj_v3', 'minhaj_v2');
            item.book = replaceAll(item.book, 'الجزء الثالث', 'الجزء الثاني');
            item.volume = replaceAll(item.volume, 'الجزء الثالث', 'الجزء الثاني');
            item.text = replaceAll(item.text, 'الجزء الثالث', 'الجزء الثاني');
            item.full_citation = replaceAll(item.full_citation, 'الجزء الثالث', 'الجزء الثاني');

            fixedEntries.push({ item, oldContent });
            v3_to_v2++;
            continue;
        }

        // Case 2: minhaj_v2 with أحوال شخصية books → should become v3
        if (item.id.startsWith('minhaj_v2') && shouldBePart3(item.hierarchy)) {
            const oldContent = (item.text || '').replace(/\s+/g, ' ').trim().substring(0, 8000);

            item.id = item.id.replace('minhaj_v2', 'minhaj_v3');
            item.book = replaceAll(item.book, 'الجزء الثاني', 'الجزء الثالث');
            item.volume = replaceAll(item.volume, 'الجزء الثاني', 'الجزء الثالث');
            item.text = replaceAll(item.text, 'الجزء الثاني', 'الجزء الثالث');
            item.full_citation = replaceAll(item.full_citation, 'الجزء الثاني', 'الجزء الثالث');

            fixedEntries.push({ item, oldContent });
            v2_to_v3++;
            continue;
        }

        // Also handle intro entries that might have المقدمة for v3
        if (item.id.startsWith('intro_') && item.book && item.book.includes('الجزء الثالث')) {
            // Check if this intro belongs to a الجزء الثالث book
            if (shouldBePart3(item.hierarchy)) {
                // Already correct, skip
            }
            // If intro is for الجزء الثالث but should be الجزء الثاني 
            else if (!shouldBePart3(item.hierarchy) && item.book.includes('الجزء الثالث')) {
                const oldContent = (item.text || '').replace(/\s+/g, ' ').trim().substring(0, 8000);
                item.book = replaceAll(item.book, 'الجزء الثالث', 'الجزء الثاني');
                if (item.volume) item.volume = replaceAll(item.volume, 'الجزء الثالث', 'الجزء الثاني');
                item.text = replaceAll(item.text, 'الجزء الثالث', 'الجزء الثاني');
                item.full_citation = replaceAll(item.full_citation, 'الجزء الثالث', 'الجزء الثاني');
                fixedEntries.push({ item, oldContent });
                v3_to_v2++;
            }
        }
        if (item.id.startsWith('intro_') && item.book && item.book.includes('الجزء الثاني')) {
            if (shouldBePart3(item.hierarchy)) {
                const oldContent = (item.text || '').replace(/\s+/g, ' ').trim().substring(0, 8000);
                item.book = replaceAll(item.book, 'الجزء الثاني', 'الجزء الثالث');
                if (item.volume) item.volume = replaceAll(item.volume, 'الجزء الثاني', 'الجزء الثالث');
                item.text = replaceAll(item.text, 'الجزء الثاني', 'الجزء الثالث');
                item.full_citation = replaceAll(item.full_citation, 'الجزء الثاني', 'الجزء الثالث');
                fixedEntries.push({ item, oldContent });
                v2_to_v3++;
            }
        }
    }

    console.log(`   🔄 الجزء الثالث → الثاني (معاملات): ${v3_to_v2} entries`);
    console.log(`   🔄 الجزء الثاني → الثالث (أحوال شخصية): ${v2_to_v3} entries`);
    console.log(`   📝 Total fixes: ${fixedEntries.length}\n`);

    // Save JSON
    console.log('💾 Saving fixed corpus...');
    fs.writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 4), 'utf-8');
    console.log('   ✅ JSON saved!\n');

    // Update Supabase
    if (!supabase) {
        console.log('⚠️ Supabase not configured. Run reingest-corpus.cjs to update.');
        return;
    }

    console.log('🔄 Updating Supabase...');
    let updated = 0, errors = 0;

    for (let i = 0; i < fixedEntries.length; i += BATCH_SIZE) {
        const batch = fixedEntries.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async ({ item, oldContent }) => {
            const newContent = (item.text || '').replace(/\s+/g, ' ').trim().substring(0, 8000);

            const { error } = await supabase
                .from('fatwas')
                .update({
                    content: newContent,
                    metadata: {
                        id: item.id,
                        book: item.book,
                        hierarchy: item.hierarchy,
                        masalah_number: item.masalah_number,
                        full_citation: item.full_citation,
                        url: item.url || '',
                        title: item.title || '',
                        volume: item.volume || '',
                    }
                })
                .eq('content', oldContent);

            if (error) {
                errors++;
                if (errors <= 5) console.error(`   ❌ ${error.message}`);
            } else {
                updated++;
            }
        }));

        const percent = Math.min(((i + BATCH_SIZE) / fixedEntries.length * 100), 100).toFixed(1);
        process.stdout.write(`\r   📊 ${Math.min(i + BATCH_SIZE, fixedEntries.length)}/${fixedEntries.length} (${percent}%)   `);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🎉 Fix Complete!                             ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   ✅ v3→v2 (معاملات): ${v3_to_v2}`);
    console.log(`   ✅ v2→v3 (أحوال شخصية): ${v2_to_v3}`);
    console.log(`   ✅ Supabase updated: ${updated}`);
    if (errors > 0) console.log(`   ❌ Errors: ${errors}`);
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
