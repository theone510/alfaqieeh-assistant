/**
 * process-v3.cjs
 * 
 * يعالج ملف JSON الخام لمنهاج الصالحين الجزء الثالث
 * ويحوله إلى نفس تنسيق final_fiqh_corpus.json
 * ثم يضيفه إلى الملف النهائي
 * 
 * الاستخدام:
 *   node scripts/process-v3.cjs
 */

const fs = require('fs');
const path = require('path');

const RAW_PATH = path.resolve(__dirname, '../منهاج الصالحين ـ الجزء الثالث (الطبعة المصححة 1445 هـ.).json');
const CORPUS_PATH = path.resolve(__dirname, '../final_fiqh_corpus.json');

const BOOK_NAME = 'منهاج الصالحين - الجزء الثالث';
const VOLUME = 'الجزء الثالث';

function splitIntoMasail(content, hierarchy) {
    const entries = [];

    // Match مسألة patterns: "مسألة N:" or "(مسألة N):"
    const masalahRegex = /(?:^|\n)\s*(?:\(?\s*مسألة\s+(\d+)\s*\)?)\s*:\s*/g;
    const matches = [...content.matchAll(masalahRegex)];

    if (matches.length === 0) {
        // No مسائل found - treat the whole content as a general entry
        entries.push({
            masalah_number: 'نص عام',
            text: content.trim()
        });
        return entries;
    }

    // Check if there's text before the first مسألة (intro text)
    const firstMatchIndex = matches[0].index;
    const introText = content.substring(0, firstMatchIndex).trim();
    if (introText.length > 10) {
        entries.push({
            masalah_number: 'تمهيد فصل',
            text: introText
        });
    }

    // Extract each مسألة
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const masalahNum = match[1];
        const startIndex = match.index + match[0].length;
        const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : content.length;
        const masalahText = content.substring(startIndex, endIndex).trim();

        if (masalahText.length > 0) {
            entries.push({
                masalah_number: masalahNum,
                text: `مسألة ${masalahNum}: ${masalahText}`
            });
        }
    }

    return entries;
}

function cleanHierarchy(title) {
    // Remove "المقدمة" prefix for standalone, keep book structure
    return title.trim();
}

function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  📚 Process منهاج الصالحين - الجزء الثالث    ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Check if raw file exists
    if (!fs.existsSync(RAW_PATH)) {
        // Try alternative path from user's temp folder  
        const altPath = "C:\\Users\\tpetr\\AppData\\Local\\Temp\\10436e8b-e810-411f-8527-6e7f1a20e9f9_017-موقع السيد السيستاني.zip.9f9\\017-موقع السيد السيستاني\\منهاج الصالحين ـ الجزء الثالث (الطبعة المصححة 1445 هـ.)\\منهاج الصالحين ـ الجزء الثالث (الطبعة المصححة 1445 هـ.).json";
        if (fs.existsSync(altPath)) {
            console.log('📂 Found file at temp path, copying...');
            fs.copyFileSync(altPath, RAW_PATH);
        } else {
            console.error('❌ Raw file not found at either location!');
            console.log('   Expected:', RAW_PATH);
            console.log('   Alt:', altPath);
            process.exit(1);
        }
    }

    console.log('📂 Loading raw JSON...');
    const rawData = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));
    const sections = rawData.title;
    console.log(`   ✅ Found ${sections.length} sections\n`);

    const newEntries = [];
    let totalMasail = 0;
    let sectionCounter = 0;

    for (const section of sections) {
        const hierarchy = cleanHierarchy(section.title);
        const content = section.content || '';

        if (!content.trim()) continue;
        sectionCounter++;

        const masail = splitIntoMasail(content, hierarchy);

        for (const m of masail) {
            const id = m.masalah_number === 'نص عام'
                ? `intro_v3_${sectionCounter}`
                : m.masalah_number === 'تمهيد فصل'
                    ? `minhaj_v3_head_${sectionCounter}`
                    : `minhaj_v3_masalah_${m.masalah_number}`;

            const fullCitation = m.masalah_number === 'نص عام' || m.masalah_number === 'تمهيد فصل'
                ? `${BOOK_NAME} - ${hierarchy} - ${m.masalah_number}`
                : `${BOOK_NAME} - ${hierarchy} - مسألة ${m.masalah_number}`;

            const prefixedText = m.masalah_number === 'نص عام' || m.masalah_number === 'تمهيد فصل'
                ? `في ${BOOK_NAME} - ${hierarchy}: ${m.text}`
                : `في ${BOOK_NAME} - ${hierarchy} - مسألة ${m.masalah_number}: ${m.text.replace(/^مسألة \d+:\s*/, '')}`;

            newEntries.push({
                id: id,
                book: BOOK_NAME,
                volume: VOLUME,
                hierarchy: hierarchy,
                masalah_number: m.masalah_number,
                text: prefixedText,
                original_text: m.text,
                full_citation: fullCitation
            });
            totalMasail++;
        }
    }

    console.log(`   📝 Processed ${totalMasail} entries from ${sectionCounter} sections\n`);

    // Show sample entries
    console.log('   📋 Sample entries:');
    for (let i = 0; i < Math.min(3, newEntries.length); i++) {
        console.log(`      [${i + 1}] id: ${newEntries[i].id}`);
        console.log(`          hierarchy: ${newEntries[i].hierarchy}`);
        console.log(`          masalah: ${newEntries[i].masalah_number}`);
        console.log(`          citation: ${newEntries[i].full_citation}`);
        console.log('');
    }

    // Load existing corpus and append
    console.log('📂 Loading existing corpus...');
    const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
    console.log(`   ✅ Existing: ${corpus.length} entries`);

    // Check for duplicates
    const existingIds = new Set(corpus.map(e => e.id));
    const uniqueNew = newEntries.filter(e => !existingIds.has(e.id));
    const dupes = newEntries.length - uniqueNew.length;

    if (dupes > 0) {
        console.log(`   ⚠️ Skipping ${dupes} duplicate entries`);
    }

    // Append
    corpus.push(...uniqueNew);
    console.log(`   📊 New total: ${corpus.length} entries\n`);

    // Save
    console.log('💾 Saving updated corpus...');
    fs.writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 4), 'utf-8');
    console.log('   ✅ Saved!\n');

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🎉 Processing Complete!                     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   ✅ Added ${uniqueNew.length} new entries`);
    console.log(`   📊 Total corpus: ${corpus.length} entries`);
    console.log('');
    console.log('   ⚡ Next: run reingest-corpus.cjs to upload to Supabase');
}

main();
